import axiosClient from "../components/axiosClient";

export async function uploadMediaToWp(file) {
  const nonce = window?.hyokaData?.mediaUploadNonce;
  if (!nonce) {
    throw new Error("Media upload not authorized.");
  }

  const formData = new FormData();
  formData.append("action", "upload-attachment");
  formData.append("async-upload", file);
  formData.append("name", file.name);
  formData.append("_wpnonce", nonce);

  const { data } = await axiosClient.post("", formData);

  const payload = data?.data ?? data;
  const ok = data?.success !== false && payload?.id;

  if (!ok) {
    const msg = payload?.message || data?.message || "Upload failed.";
    throw new Error(typeof msg === "string" ? msg : "Upload failed.");
  }

  const uploadedUrl = payload.url || payload.source_url || payload.guid || "";
  const id = payload.id;

  return {
    id,
    attachmentId: id,
    url: uploadedUrl,
    isUserUploaded: true,
    deleteNonce: payload.nonces?.delete || "",
  };
}
