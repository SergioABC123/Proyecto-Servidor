import * as dgraph from "dgraph-js";
import { dgraphClient } from "../../../config/dgraph.config";

async function buscarUidUsuarioPorMongoId(mongoId: string): Promise<string> {
  const txn = dgraphClient.newTxn();

  try {
    const query = `
      query buscar($mongoId: string) {
        usuario(func: eq(mongo_id, $mongoId)) {
          uid
        }
      }
    `;
    const res = await txn.queryWithVars(query, { $mongoId: mongoId });
    const data = res.getJson();

    if (!data.usuario || data.usuario.length === 0) {
      throw new Error(`No se encontró un Usuario en Dgraph con mongo_id: ${mongoId}`);
    }

    return data.usuario[0].uid;
  } finally {
    await txn.discard();
  }
}


// Conectamos a un usuario con un nodo Match 
// Usamos "set" (agregar), no reemplaza las conexiones existentes, porque un usuario puede tener varios matches a la vez.
async function conectarUsuarioAMatch(usuarioUid: string, matchUid: string): Promise<void> {
  const txn = dgraphClient.newTxn();
  try {
    const mu = new dgraph.Mutation();
    mu.setSetJson({
      uid: usuarioUid,
      usuario_conecta: [{ uid: matchUid }],
    });
    mu.setCommitNow(true);
    await txn.mutate(mu);
  } finally {
    await txn.discard();
  }
}


// Creamos el nodo Match en Dgraph y lo conecta con ambos usuarios con la arista usuario_conecta 
export async function crearMatchEnDgraph(
  mongoIdUsuarioA: string,
  mongoIdUsuarioB: string
): Promise<string> {
  const usuarioAUid = await buscarUidUsuarioPorMongoId(mongoIdUsuarioA);
  const usuarioBUid = await buscarUidUsuarioPorMongoId(mongoIdUsuarioB);

  const txn = dgraphClient.newTxn();
  let matchUid: string | undefined;

  try {
    const nuevoMatch = {
      "dgraph.type": "Match",
      fecha: new Date().toISOString(),
    };

    const mu = new dgraph.Mutation();
    mu.setSetJson(nuevoMatch);
    mu.setCommitNow(true);

    const response = await txn.mutate(mu);
    const uidsMap = response.getUidsMap();

    uidsMap.forEach((uid) => {
      if (!matchUid) matchUid = uid;
    });

    if (!matchUid) {
      throw new Error("Dgraph no devolvió un uid para el nodo Match recién creado");
    }

    console.log(`Nodo Match creado en Dgraph con uid: ${matchUid}`);
  } finally {
    await txn.discard();
  }

  await conectarUsuarioAMatch(usuarioAUid, matchUid);
  await conectarUsuarioAMatch(usuarioBUid, matchUid);

  console.log(`Match conectado entre ${mongoIdUsuarioA} y ${mongoIdUsuarioB} en Dgraph`);
  return matchUid;
}

export interface MatchConCompanero {
  fecha: string;
  companero: { mongo_id: string; nombre: string };
}

interface MatchRawDgraph {
  fecha: string;
  companero?: Array<{ mongo_id: string; nombre: string }>;
}

// Devuelvemos todos los matches de un usuario, con los datos del compañero de cada match (no del propio usuario).
export async function obtenerMatchesDeUsuario(mongoId: string): Promise<MatchConCompanero[]> {
  const txn = dgraphClient.newTxn();

  try {
    const query = `
      query misMatches($mongoId: string) {
        usuario(func: eq(mongo_id, $mongoId)) {
          usuario_conecta {
            fecha
            companero: ~usuario_conecta @filter(NOT eq(mongo_id, $mongoId)) {
              mongo_id
              nombre
            }
          }
        }
      }
    `;

    const res = await txn.queryWithVars(query, { $mongoId: mongoId });
    const data = res.getJson();

    if (!data.usuario || data.usuario.length === 0) {
      return [];
    }

    const matchesRaw: MatchRawDgraph[] = data.usuario[0].usuario_conecta || [];

    const resultado: MatchConCompanero[] = matchesRaw
      .filter((m: MatchRawDgraph) => m.companero && m.companero.length > 0)
      .map((m: MatchRawDgraph) => ({
        fecha: m.fecha,
        companero: {
          mongo_id: m.companero![0].mongo_id,
          nombre: m.companero![0].nombre,
        },
      }));

    return resultado;
  } catch (err) {
    console.error(`Error obteniendo matches de ${mongoId}:`, err);
    throw err;
  } finally {
    await txn.discard();
  }
}