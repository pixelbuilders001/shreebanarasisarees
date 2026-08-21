"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

const CLARITY_PROJECT_ID = "y5ogehr1op";

export default function MicrosoftClarity() {
  useEffect(() => {
    if (typeof window !== "undefined" && CLARITY_PROJECT_ID) {
      Clarity.init(CLARITY_PROJECT_ID);
    }
  }, []);

  return null;
}
