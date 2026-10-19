async function loadFile(fileName, data, ...args) {
  try {
    const Fetched = await fetch(fileName);
    data  = await Fetched.json();
    for (let arg of args) {
      arg(data);
    }
  } catch (e) {
    console.error("Error loading:", e);
  }
}