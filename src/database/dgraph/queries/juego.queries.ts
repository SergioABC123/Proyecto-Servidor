import * as dgraph from "dgraph-js";
import { dgraphClient } from "../../../config/dgraph.config";

export async function crearJuegoEnDgraph(
  mongoId: string,
  nombreJuego: string
): Promise<string> {
  const txn = dgraphClient.newTxn();

  try {
    const nuevoJuego = {
      "dgraph.type": "Juego",
      mongo_id: mongoId,
      nombre_juego: nombreJuego,
    };

    const mu = new dgraph.Mutation();
    mu.setSetJson(nuevoJuego);
    mu.setCommitNow(true);

    const response = await txn.mutate(mu);
    const uidsMap = response.getUidsMap();
    
    let nuevoUid: string | undefined;
    uidsMap.forEach((uid) => {
      if (!nuevoUid) nuevoUid = uid;
    });

    if (!nuevoUid) {
      throw new Error("Dgraph no devolvió un uid para el nodo Juego recién creado");
    }

    console.log(`Nodo Juego creado en Dgraph con uid: ${nuevoUid}`);
    return nuevoUid;
  } catch (err) {
    console.error("Error creando el juego en Dgraph:", err);
    throw err;
  } finally {
    await txn.discard();
  }
}

export async function actualizarJuegoEnDgraph(
  mongoId: string,
  cambios: { nombre_juego?: string }
): Promise<void> {
  const txn = dgraphClient.newTxn();

  try {
    const query = `
      query buscar($mongoId: string) {
        juego(func: eq(mongo_id, $mongoId)) {
          uid
        }
      }
    `;
    const res = await txn.queryWithVars(query, { $mongoId: mongoId });
    const data = res.getJson();

    if (!data.juego || data.juego.length === 0) {
      throw new Error(`No se encontró un nodo Juego en Dgraph con mongo_id: ${mongoId}`);
    }

    const uid = data.juego[0].uid;

    const mu = new dgraph.Mutation();
    mu.setSetJson({ uid, ...cambios });
    mu.setCommitNow(true);

    await txn.mutate(mu);
    console.log(`Juego ${mongoId} actualizado en Dgraph (uid: ${uid})`);
  } catch (err) {
    console.error(`Error actualizando juego en Dgraph:`, err);
    throw err;
  } finally {
    await txn.discard();
  }
}