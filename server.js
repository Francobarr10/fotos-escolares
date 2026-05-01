const fs = require("fs");
const path = require("path");
const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_TOKEN
});

// 🧪 Ruta base
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🔥 CREAR PAGO + GUARDAR PEDIDO
app.post("/crear-pago", async (req, res) => {
  const { alumno, curso, paquete } = req.body;

  console.log("Datos recibidos:", alumno, curso, paquete);

  const precios = {
    "Básico": 100,
    "Intermedio": 5000,
    "Completo": 8000
  };

  // 🔑 ID único del pedido
  const pedidoId = Date.now().toString();

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
          success: "https://fotos-escolares-en0h.onrender.com",
          failure: "https://fotos-escolares-en0h.onrender.com"
        },
        notification_url: "https://fotos-escolares-en0h.onrender.com/webhook",

        // 🔥 CLAVE PARA VINCULAR
        external_reference: pedidoId
      }
    });

    // 🔥 GUARDAR PEDIDO
    let pedidos = [];
    if (fs.existsSync("pedidos.json")) {
      pedidos = JSON.parse(fs.readFileSync("pedidos.json"));
    }

    pedidos.push({
      id: pedidoId,
      alumno,
      curso,
      paquete,
      estado: "pendiente"
    });

    fs.writeFileSync("pedidos.json", JSON.stringify(pedidos, null, 2));

    res.json({ init_point: response.init_point });

  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send("Error al crear pago");
  }
});

// 🔥 WEBHOOK → MARCAR SOLO EL PEDIDO CORRECTO
app.post("/webhook", async (req, res) => {
  const data = req.body;

  console.log("WEBHOOK:", data);

  try {
    const paymentId = data?.data?.id;
    if (!paymentId) return res.sendStatus(200);

    // 🔥 traer info del pago
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_TOKEN}`
      }
    });

    const payment = await mpRes.json();

    console.log("PAGO INFO:", payment);

    if (payment.status === "approved") {
      const pedidoId = payment.external_reference;

      let pedidos = [];
      if (fs.existsSync("pedidos.json")) {
        pedidos = JSON.parse(fs.readFileSync("pedidos.json"));
      }

      pedidos = pedidos.map(p => {
        if (p.id === pedidoId) {
          return { ...p, estado: "pagado" };
        }
        return p;
      });

      fs.writeFileSync("pedidos.json", JSON.stringify(pedidos, null, 2));

      console.log("✅ PEDIDO ACTUALIZADO:", pedidoId);
    }

  } catch (err) {
    console.log("ERROR WEBHOOK:", err);
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});