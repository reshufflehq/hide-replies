const {
  NODE_ENV,
  LOCAL_URL,
  RESHUFFLE_APPLICATION_DOMAINS,
} = process.env;

export function getUrl() {
  const isProd = NODE_ENV === 'prod' || NODE_ENV === 'production';
  const localUrl = LOCAL_URL;
  const remoteUrl = `https://${RESHUFFLE_APPLICATION_DOMAINS}`;
  return isProd ? remoteUrl : localUrl;
}
