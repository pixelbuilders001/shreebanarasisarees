import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  source: "gps" | "pincode";

  // Required when source = gps
  customerLat?: number;
  customerLng?: number;

  // Required when source = pincode
  pincode?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
  source: "gps" | "pincode";
}

Deno.serve(async (req) => {
  // ------------------------------------------
  // CORS
  // ------------------------------------------

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Method not allowed",
      },
      405,
    );
  }

  try {
    // ------------------------------------------
    // SUPABASE CLIENT
    // ------------------------------------------

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");

    let secretKey = serviceRoleKey;

    if (!secretKey && secretKeysRaw) {
      try {
        const secretKeys = JSON.parse(secretKeysRaw);
        secretKey = secretKeys["default"];
      } catch (e) {
        console.error("Error parsing SUPABASE_SECRET_KEYS:", e);
      }
    }

    if (!supabaseUrl || !secretKey) {
      throw new Error("Supabase environment variables are missing");
    }

    const supabase = createClient(
      supabaseUrl,
      secretKey,
    );

    // ------------------------------------------
    // READ REQUEST
    // ------------------------------------------

    let body: RequestBody;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        400,
      );
    }

    const { source } = body;

    if (source !== "gps" && source !== "pincode") {
      return jsonResponse(
        {
          success: false,
          error: "source must be either 'gps' or 'pincode'",
        },
        400,
      );
    }

    // ------------------------------------------
    // GET DELIVERY SETTINGS
    // ------------------------------------------

    const { data: settings, error: settingsError } =
      await supabase
        .from("delivery_settings")
        .select(`
          id,
          serviceable_district,
          serviceable_state,
          shop_latitude,
          shop_longitude,
          express_max_km,
          express_max_minutes,
          express_packing_buffer_minutes,
          express_delivery_buffer_minutes,
          is_express_20min_enabled,
          is_active
        `)
        .eq("id", "default")
        .maybeSingle();

    if (settingsError) {
      console.error("Delivery settings error:", settingsError);

      return jsonResponse(
        {
          success: false,
          error: "Unable to load delivery settings",
        },
        500,
      );
    }

    // Default settings fallback if missing from DB
    const shopLat = Number(settings?.shop_latitude ?? 25.855802);
    const shopLng = Number(settings?.shop_longitude ?? 85.779337);
    const maxDistanceKm = Number(settings?.express_max_km ?? 5.0);
    const maxEtaMinutes = Number(settings?.express_max_minutes ?? 20);
    const packingBufferMinutes = Number(settings?.express_packing_buffer_minutes ?? 3);
    const deliveryBufferMinutes = Number(settings?.express_delivery_buffer_minutes ?? 3);
    const isActive = settings?.is_active ?? true;
    const isExpressEnabled = settings?.is_express_20min_enabled ?? true;
    const serviceableDistrict = settings?.serviceable_district ?? "Samastipur";
    const serviceableState = settings?.serviceable_state ?? "Bihar";

    // ------------------------------------------
    // CHECK FEATURE STATUS
    // ------------------------------------------

    if (!isActive) {
      return jsonResponse({
        success: true,
        eligible: false,
        is20MinDelivery: false,
        reason: "delivery_disabled",
        message: "Delivery service is currently unavailable.",
      });
    }

    if (!isExpressEnabled) {
      return jsonResponse({
        success: true,
        eligible: false,
        is20MinDelivery: false,
        reason: "express_delivery_disabled",
        message: "20-minute delivery is currently unavailable.",
      });
    }

    // ------------------------------------------
    // GET CUSTOMER COORDINATES
    // ------------------------------------------

    const customerCoordinates =
      await getCustomerCoordinates(body);

    // ------------------------------------------
    // VALIDATE COORDINATES
    // ------------------------------------------

    validateCoordinates(
      customerCoordinates.latitude,
      customerCoordinates.longitude,
    );

    // ------------------------------------------
    // CALCULATE ACTUAL ROAD ROUTE
    // ------------------------------------------

    const route = await getRoadRoute(
      shopLng,
      shopLat,
      customerCoordinates.longitude,
      customerCoordinates.latitude,
    );

    // ------------------------------------------
    // CONVERT ROUTE DATA
    // ------------------------------------------

    const distanceKm = Number(
      (route.distance / 1000).toFixed(2),
    );

    const routeMinutes = Math.ceil(
      route.duration / 60,
    );

    const totalEtaMinutes =
      routeMinutes +
      packingBufferMinutes +
      deliveryBufferMinutes;

    const maxDistanceKm = 20.0;

    // ------------------------------------------
    // ELIGIBILITY (Under 20 km = Express)
    // ------------------------------------------

    const isExpress = distanceKm <= maxDistanceKm;

    // ------------------------------------------
    // CUSTOMER MESSAGE
    // ------------------------------------------

    let message = "";

    if (isExpress) {
      message = `🚀 Express delivery available! Estimated delivery in about ${totalEtaMinutes} minutes.`;
    } else {
      message = `📦 Standard delivery available! Estimated delivery in 3–5 Business Days.`;
    }

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    return jsonResponse({
      success: true,

      eligible: isExpress,
      is20MinDelivery: isExpress,
      isExpress,

      message,

      source: customerCoordinates.source,

      pincode: body.pincode,
      distanceKm,
      routeMinutes,
      packingBufferMinutes,
      deliveryBufferMinutes,
      customerEtaMinutes: totalEtaMinutes,

      distance: {
        km: distanceKm,
        maxKm: maxDistanceKm,
      },

      route: {
        minutes: routeMinutes,
      },

      eta: {
        minutes: totalEtaMinutes,
        packingBufferMinutes,
        deliveryBufferMinutes,
        formattedDelivery: isExpress ? `~${totalEtaMinutes} mins` : "3–5 Business Days",
      },

      serviceArea: {
        district: serviceableDistrict,
        state: serviceableState,
      },
    });
  } catch (error) {
    console.error(
      "calculate-delivery error:",
      error,
    );

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate delivery",
      },
      500,
    );
  }
});


// ==================================================
// CUSTOMER COORDINATES
// ==================================================

async function getCustomerCoordinates(
  body: RequestBody,
): Promise<Coordinates> {
  // ------------------------------------------
  // GPS
  // ------------------------------------------

  if (body.source === "gps") {
    if (
      typeof body.customerLat !== "number" ||
      typeof body.customerLng !== "number"
    ) {
      throw new Error(
        "customerLat and customerLng are required for GPS",
      );
    }

    return {
      latitude: body.customerLat,
      longitude: body.customerLng,
      source: "gps",
    };
  }

  // ------------------------------------------
  // PINCODE
  // ------------------------------------------

  if (!body.pincode) {
    throw new Error(
      "Pincode is required",
    );
  }

  const pincode = body.pincode.trim();

  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    throw new Error(
      "Invalid Indian pincode",
    );
  }

  return await getCoordinatesFromPincode(
    pincode,
  );
}


// ==================================================
// PINCODE → COORDINATES
// ==================================================

async function getCoordinatesFromPincode(
  pincode: string,
): Promise<Coordinates> {
  // Method 1: OpenStreetMap Nominatim for Indian Pincodes
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`,
      {
        headers: { "User-Agent": "ShreeBanarasiSarees/1.0" },
      }
    );
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData) && nomData.length > 0 && nomData[0].lat && nomData[0].lon) {
        return {
          latitude: parseFloat(nomData[0].lat),
          longitude: parseFloat(nomData[0].lon),
          source: "pincode",
        };
      }
    }
  } catch (err) {
    console.error("Nominatim pincode lookup error:", err);
  }

  // Method 2: Fallback to Zippopotam India
  try {
    const zipRes = await fetch(`https://api.zippopotam.us/in/${pincode}`);
    if (zipRes.ok) {
      const zipData = await zipRes.json();
      if (zipData.places && zipData.places.length > 0) {
        const place = zipData.places[0];
        return {
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude),
          source: "pincode",
        };
      }
    }
  } catch (err) {
    console.error("Zippopotam pincode lookup error:", err);
  }

  // Method 3: Fallback to PostalPincode.in + Nominatim District Search
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0] && data[0].Status === "Success" && data[0].PostOffice?.[0]) {
        const po = data[0].PostOffice[0];
        const locationQuery = `${po.District || po.Block || po.Circle}, ${po.State}, India`;
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json`,
          { headers: { "User-Agent": "ShreeBanarasiSarees/1.0" } }
        );
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0 && nomData[0].lat && nomData[0].lon) {
            return {
              latitude: parseFloat(nomData[0].lat),
              longitude: parseFloat(nomData[0].lon),
              source: "pincode",
            };
          }
        }
      }
    }
  } catch (err) {
    console.error("PostalPincode lookup error:", err);
  }

  throw new Error("We couldn't find coordinates for this pincode. Please check and try again.");
}


// ==================================================
// ROAD ROUTING
// ==================================================

async function getRoadRoute(
  shopLng: number,
  shopLat: number,
  customerLng: number,
  customerLat: number,
) {
  const coordinates =
    `${shopLng},${shopLat};${customerLng},${customerLat}`;

  const url =
    `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Routing service unavailable",
    );
  }

  const data = await response.json();

  if (data.code !== "Ok") {
    throw new Error(
      "Unable to calculate road route",
    );
  }

  if (
    !data.routes ||
    data.routes.length === 0
  ) {
    throw new Error(
      "No road route found",
    );
  }

  return data.routes[0];
}


// ==================================================
// COORDINATE VALIDATION
// ==================================================

function validateCoordinates(
  latitude: number,
  longitude: number,
) {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "Invalid latitude",
    );
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "Invalid longitude",
    );
  }
}


// ==================================================
// RESPONSE HELPER
// ==================================================

function jsonResponse(
  data: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}
