const path = require("path");
const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 🔐 CONFIG NUEVA
const client = new MercadoPagoConfig({
  accessToken: "TEST-592249707142634-043019-46d0fa0b103523505f523424294a13bc-537843020"
});

// 🧪 Ruta base
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/crear-pago", async (req, res) => {
  const { alumno, curso, paquete } = req.body;

  console.log("Datos recibidos:", alumno, curso, paquete);

  const precios = {
    "Básico": 3000,
    "Intermedio": 5000,
    "Completo": 8000
  };

  try {
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: `Fotos escolares - ${paquete}`,
            quantity: 1,
            unit_price: Number(precios[paquete]),
            currency_id: "ARS"
          }
        ],
        back_urls: {
          success: "http://localhost:3000",
          failure: "http://localhost:3000"
        }
      }
    });

    res.json({ init_point: response.init_point });

  } catch (error) {
  console.log("ERROR COMPLETO:");
  console.log(error);
  console.log("STATUS:", error.status);
  console.log("MESSAGE:", error.message);
  console.log("CAUSE:", error.cause);
  res.status(500).send("Error al crear pago");
}
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});