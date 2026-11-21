export const optimizeImage = (src, width = 900) => {
  const marker = "/image/upload/";
  if (!src?.includes("res.cloudinary.com") || !src.includes(marker)) return src;
  const tail = src.slice(src.indexOf(marker) + marker.length);
  const firstSegment = tail.split("/")[0];
  if (/(?:^|,)(?:f_|q_|w_|h_|c_)/.test(firstSegment)) return src;
  return src.replace(marker, `${marker}f_auto,q_auto,w_${width},c_limit/`);
};
