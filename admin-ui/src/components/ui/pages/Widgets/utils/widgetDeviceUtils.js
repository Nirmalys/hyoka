export const PREVIEW_DEVICE_WIDTHS = {
  mobile: 375,
  tablet: 768,
  desktop: 1200,
};

export function getDeviceLayout(device = "desktop") {
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  const isDesktop = device === "desktop" || !device;

  return { device, isMobile, isTablet, isDesktop };
}

export function deviceClass(device, { mobile = "", tablet = "", desktop = "" } = {}) {
  const { isMobile, isTablet } = getDeviceLayout(device);
  if (isMobile) return mobile;
  if (isTablet) return tablet || desktop;
  return desktop;
}

export function getPreviewFrameStyle(device = "desktop") {
  const { isDesktop } = getDeviceLayout(device);

  if (isDesktop) {
    return { width: "100%", maxWidth: `${PREVIEW_DEVICE_WIDTHS.desktop}px` };
  }

  const width = PREVIEW_DEVICE_WIDTHS[device] || PREVIEW_DEVICE_WIDTHS.desktop;
  return { width: `${width}px`, maxWidth: `${width}px` };
}
