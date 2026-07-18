import { Response } from "express";
import { AuthRequest } from "../types/auth-request";
import { HttpStatus } from "../types/https-status";
import { obtenerMatchesDeUsuario } from "../database/dgraph/queries/match.queries";

export async function listarMisMatches(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
        }

        const mongoId = req.user._id.toString();
        const matches = await obtenerMatchesDeUsuario(mongoId);

        return res.json({ data: matches });

    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.SERVER_ERROR).json({ message: "Error del servidor" });
    }
}