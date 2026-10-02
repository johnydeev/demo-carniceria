import coreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...coreWebVitals,
  // Generado por `msw init`: no se edita a mano.
  { ignores: ['public/mockServiceWorker.js'] },
  // Pantallas del panel apartadas hasta la fase 3: son copia literal de la app
  // de origen, que lintea limpia con eslint-plugin-react-hooks 7.0.1. La 7.1.1
  // que trajo la instalacion de la demo es mas estricta con estas dos reglas.
  // Se reescriben en la fase 3: ahi se saca esta excepcion.
  {
    files: ['src/app/admin/**/PaginaPanel.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
];

export default eslintConfig;
