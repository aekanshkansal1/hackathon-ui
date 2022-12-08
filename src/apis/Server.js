import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:5000"
})

export async function interact(message) {
  const response = await instance.post("/interact", {
    type: "TEXT",
    text: message
  })

  return response.data.text;
}
