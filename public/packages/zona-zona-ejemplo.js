// Paquete de zona: Zona Ejemplo
exports.zonaId = "zona-ejemplo";
exports.zonaNombre = "Zona Ejemplo";
exports.apartamentos = [
  {
    "id": "ejemplo-1",
    "titulo": "Apto Ejemplo Norte",
    "barrio": "Zona Ejemplo",
    "tipo": "apto",
    "precio": 1800000,
    "precioTexto": "$1.8M",
    "habitaciones": 2,
    "banos": 1,
    "metros": 55,
    "descripcion": "Apartamento de ejemplo descargado desde el paquete de zona.",
    "amenidades": ["Parqueadero"],
    "rareza": "comun",
    "puntos": 50,
    "lat": 6.2288,
    "lng": -75.577,
    "fotos": ["/fotos/fachada-moderna.svg"]
  },
  {
    "id": "ejemplo-2",
    "titulo": "Casa Ejemplo",
    "barrio": "Zona Ejemplo",
    "tipo": "casa",
    "precio": 3200000,
    "precioTexto": "$3.2M",
    "habitaciones": 3,
    "banos": 2,
    "metros": 95,
    "descripcion": "Casa espaciosa de ejemplo descargada desde el paquete.",
    "amenidades": ["Patio", "Garaje"],
    "rareza": "raro",
    "puntos": 120,
    "lat": 6.2298,
    "lng": -75.578,
    "fotos": ["/fotos/casa-exterior.svg"]
  }
];
