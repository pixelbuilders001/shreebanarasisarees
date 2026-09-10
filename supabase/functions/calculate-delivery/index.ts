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
          same_day_max_km,
          standard_max_km,
          express_charge,
          same_day_charge,
          standard_charge,
          express_min_minutes,
          express_max_minutes,
          same_day_cutoff_time,
          express_packing_buffer_minutes,
          express_delivery_buffer_minutes,
          is_express_20min_enabled,
          is_active,
          standard_delivery_days
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
    const sameDayMaxKm = Number(settings?.same_day_max_km ?? 10.0);
    const standardMaxKm = Number(settings?.standard_max_km ?? 20.0);
    const expressCharge = Number(settings?.express_charge ?? 29);
    const sameDayCharge = Number(settings?.same_day_charge ?? 49);
    const standardCharge = Number(settings?.standard_charge ?? 69);
    const expressMinMinutes = Number(settings?.express_min_minutes ?? 60);
    const expressMaxMinutes = Number(settings?.express_max_minutes ?? 120);
    const sameDayCutoffTime = String(settings?.same_day_cutoff_time ?? "17:00:00");
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

    // ------------------------------------------
    // OPERATING HOURS & CUTOFF CHECK (IST)
    // - 9 AM to 8 PM (09:00 - 19:59): Normal 20-min express flow
    // - 8 PM to 12 AM (20:00 - 23:59): Tomorrow Morning (by 10:00 AM)
    // - 12 AM to 9 AM (00:00 - 08:59): Today Morning (by 10:00 AM)
    // ------------------------------------------

    const istHourString = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date());

    const istHour = parseInt(istHourString, 10);
    const isNormalHours = istHour >= 9 && istHour < 20;
    const isAfterMidnight = istHour < 9;
    const isAfter8PM = istHour >= 20;
    const isStoreClosed = !isNormalHours;

    // ------------------------------------------
    // ELIGIBILITY (Within maxDistanceKm & maxEtaMinutes)
    // ------------------------------------------

    const distanceEligible = distanceKm <= maxDistanceKm;
    const timeEligible = totalEtaMinutes <= maxEtaMinutes;
    const isExpress = distanceEligible && timeEligible;

    let reason = "eligible";
    if (!distanceEligible) {
      reason = "distance_exceeded";
    } else if (!timeEligible) {
      reason = "eta_exceeded";
    }

    // ------------------------------------------
    // CUSTOMER MESSAGE & FORMATTED DELIVERY
    // ------------------------------------------

    let message = "";
    let storeClosedMessage = "";
    let formattedDelivery = "";

    if (isExpress) {
      if (isNormalHours) {
        message = `🚀 20-minute delivery available! Estimated delivery in about ${totalEtaMinutes} minutes.`;
        formattedDelivery = `~${totalEtaMinutes} mins`;
      } else if (isAfterMidnight) {
        message = "☀️ Order now for Today Morning Express Delivery (by 10:00 AM)!";
        storeClosedMessage = "Place your order now! Priority express delivery will arrive this morning by 10:00 AM.";
        formattedDelivery = "Today Morning (by 10:00 AM)";
      } else {
        // isAfter8PM (20:00 to 23:59)
        message = "🌙 Order tonight for Next-Morning Express Delivery (by 10:00 AM)!";
        storeClosedMessage = "Place your order tonight! Priority express delivery will arrive first thing tomorrow morning by 10:00 AM.";
        formattedDelivery = "Tomorrow Morning (by 10:00 AM)";
      }
    } else if (!distanceEligible) {
      const stdDays = Number(settings?.standard_delivery_days ?? 3);
      message = `20-minute delivery is available within ${maxDistanceKm} km. Your location is approximately ${distanceKm} km away by road. Standard delivery available (${stdDays}–${stdDays + 2} Business Days).`;
      formattedDelivery = `${stdDays}–${stdDays + 2} Business Days`;
    } else {
      const stdDays = Number(settings?.standard_delivery_days ?? 3);
      message = `20-minute delivery is not available for this location. Estimated delivery time is about ${totalEtaMinutes} minutes. Standard delivery available (${stdDays}–${stdDays + 2} Business Days).`;
      formattedDelivery = `${stdDays}–${stdDays + 2} Business Days`;
    }

    // ------------------------------------------
    // BUILD DELIVERY OPTIONS BASED ON DELIVERY SETTINGS & DISTANCE
    // ------------------------------------------

    let sameDayCutoffHour = 17;
    let sameDayCutoffMinute = 0;
    if (sameDayCutoffTime) {
      const parts = sameDayCutoffTime.split(":");
      if (parts.length >= 2) {
        sameDayCutoffHour = parseInt(parts[0], 10) || 17;
        sameDayCutoffMinute = parseInt(parts[1], 10) || 0;
      }
    }
    const istMinuteString = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      minute: "numeric",
    }).format(new Date());
    const istMinute = parseInt(istMinuteString, 10);
    const isBeforeSameDayCutoff =
      istHour < sameDayCutoffHour ||
      (istHour === sameDayCutoffHour && istMinute <= sameDayCutoffMinute);

    const cutoffDisplay = `${sameDayCutoffHour > 12 ? sameDayCutoffHour - 12 : sameDayCutoffHour}:${sameDayCutoffMinute < 10 ? "0" + sameDayCutoffMinute : sameDayCutoffMinute} ${sameDayCutoffHour >= 12 ? "PM" : "AM"}`;

    // Condition:
    // If distanceKm <= sameDayMaxKm (within local delivery radius for same day or express):
    // ALL 3 delivery options (express, same_day, standard) are AVAILABLE so the customer can choose.
    // If distanceKm > sameDayMaxKm (standard delivery only pincode across India):
    // Express and same day are DISABLED (available: false), and ONLY standard delivery is available.
    const isLocalDeliveryEligible = distanceKm <= sameDayMaxKm && isActive;

    const options = [
      {
        id: "express",
        title: isExpressEnabled && isNormalHours ? "20-Min Express Delivery" : "Express Delivery",
        charge: expressCharge,
        eta: isExpressEnabled && isNormalHours ? `~${totalEtaMinutes} mins` : formattedDelivery,
        badge: isExpressEnabled && isNormalHours ? "⚡ 20-Min Express" : "⚡ Express",
        description: `Direct hand delivery from our showroom (within ${maxDistanceKm} km)`,
        available: isLocalDeliveryEligible,
        unavailableReason: !isLocalDeliveryEligible
          ? "Standard delivery only for this pincode"
          : undefined,
        image: "/expressdel.webp",
      },
      {
        id: "same_day",
        title: "Same Day Delivery",
        charge: sameDayCharge,
        eta: isBeforeSameDayCutoff ? "Today by 9:00 PM" : "Tomorrow by 9:00 PM",
        badge: isBeforeSameDayCutoff ? "Today Evening" : "Tomorrow",
        description: isBeforeSameDayCutoff
          ? `Order before ${cutoffDisplay} for delivery today`
          : `Orders placed after ${cutoffDisplay} arrive tomorrow`,
        available: isLocalDeliveryEligible,
        unavailableReason: !isLocalDeliveryEligible
          ? "Standard delivery only for this pincode"
          : undefined,
        image: "/sameday.webp",
      },
      {
        id: "standard",
        title: "Standard Delivery",
        charge: standardCharge,
        eta: `${Number(settings?.standard_delivery_days ?? 3)}–${Number(settings?.standard_delivery_days ?? 3) + 2} Business Days`,
        badge: "Standard",
        description: "Tracked express courier delivery across India",
        available: isActive,
        image: "/standarddel.webp",
      },
    ];

    // ------------------------------------------
    // RESPONSE (Unified for all client specifications)
    // ------------------------------------------

    return jsonResponse({
      success: true,

      eligible: isExpress,
      is20MinDelivery: isExpress && isNormalHours,
      isExpress,
      isStoreClosed,
      isAfterMidnight,
      isAfter8PM,
      storeClosedMessage,

      reason,
      message,

      source: customerCoordinates.source,

      pincode: body.pincode,
      distanceKm,
      routeMinutes,
      packingBufferMinutes,
      deliveryBufferMinutes,
      customerEtaMinutes: totalEtaMinutes,

      options,
      deliverySettings: settings,
      delivery_settings: settings,

      distance: {
        km: distanceKm,
        maxKm: maxDistanceKm,
      },

      route: {
        minutes: routeMinutes,
      },

      eta: {
        minutes: totalEtaMinutes,
        maxMinutes: maxEtaMinutes,
        packingBufferMinutes,
        deliveryBufferMinutes,
        formattedDelivery,
      },

      location: {
        latitude: customerCoordinates.latitude,
        longitude: customerCoordinates.longitude,
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
// HAVERSINE FALLBACK ROUTING
// ==================================================

function calculateHaversineRoute(
  shopLng: number,
  shopLat: number,
  customerLng: number,
  customerLat: number,
): { distance: number; duration: number } {
  const R = 6371; // Earth radius in km
  const dLat = ((customerLat - shopLat) * Math.PI) / 180;
  const dLon = ((customerLng - shopLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((shopLat * Math.PI) / 180) *
      Math.cos((customerLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistanceKm = R * c;

  // Road curvature factor: Indian urban roads average ~1.35x straight-line distance
  const estimatedRoadKm = straightDistanceKm * 1.35;
  const distanceMeters = Math.round(estimatedRoadKm * 1000);

  // Average rider bike speed in Samastipur: ~25 km/h
  const durationSeconds = Math.round((estimatedRoadKm / 25) * 3600);

  return {
    distance: distanceMeters,
    duration: durationSeconds,
  };
}

// ==================================================
// ROAD ROUTING
// ==================================================

async function getRoadRoute(
  shopLng: number,
  shopLat: number,
  customerLng: number,
  customerLat: number,
): Promise<{ distance: number; duration: number }> {
  try {
    const coordinates =
      `${shopLng},${shopLat};${customerLng},${customerLat}`;

    const url =
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`OSRM routing returned HTTP ${response.status}, using Haversine fallback`);
      return calculateHaversineRoute(shopLng, shopLat, customerLng, customerLat);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.warn("OSRM returned invalid route data, using Haversine fallback");
      return calculateHaversineRoute(shopLng, shopLat, customerLng, customerLat);
    }

    return {
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
    };
  } catch (err) {
    console.warn("OSRM routing request failed or timed out, using Haversine fallback:", err);
    return calculateHaversineRoute(shopLng, shopLat, customerLng, customerLat);
  }
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
