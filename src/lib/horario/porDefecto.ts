import type { HorarioConfig } from './esquema';

/**
 * Horario hasta el primer guardado en el panel: el de negocio.config.ts
 * corregido (viernes y sabado de corrido). Los margenes y las horas exactas
 * los confirma el dueno en /admin/horario.
 */
export const HORARIO_POR_DEFECTO: HorarioConfig = {
  semana: {
    lunes: [],
    martes: [
      { abre: '08:15', cierra: '13:00' },
      { abre: '17:00', cierra: '20:45' },
    ],
    miercoles: [
      { abre: '08:15', cierra: '13:00' },
      { abre: '17:00', cierra: '20:45' },
    ],
    jueves: [
      { abre: '08:15', cierra: '13:00' },
      { abre: '17:00', cierra: '20:45' },
    ],
    viernes: [{ abre: '08:15', cierra: '20:45' }],
    sabado: [{ abre: '08:15', cierra: '20:45' }],
    domingo: [{ abre: '08:15', cierra: '13:00' }],
  },
  margenRetiroMin: 30,
  margenEnvioMin: 90,
  diasAnticipacion: 3,
  fechasCerradas: [],
};
