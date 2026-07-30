import { openf1 } from "./src/lib/openf1.ts";

async function test() {
  const session_key = 9158;
  const latestDate = "2023-09-15T10:34:04.401000+00:00";
  
  try {
    const locs = await openf1("location", { session_key, "date>": latestDate });
    console.log("Location fetched:", Array.isArray(locs) ? locs.length : locs);
  } catch (e: any) {
    console.log("Location error:", e.message);
  }
  
  try {
    const carData = await openf1("car_data", { session_key, "date>": latestDate });
    console.log("Car data fetched:", Array.isArray(carData) ? carData.length : carData);
  } catch (e: any) {
    console.log("Car data error:", e.message);
  }
}
test();
