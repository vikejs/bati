export default async function getDataJson() {
  const dataJson = {
    stackNameSuffix: generateRandomPrefix(8),
  };
  return dataJson;
}

// Function to generate a random string
function generateRandomPrefix(length: number): string {
  if (process.env.NODE_ENV === "test") return "TEST";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
