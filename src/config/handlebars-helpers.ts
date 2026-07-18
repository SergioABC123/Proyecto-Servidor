export const handlebarsHelpers = {
    colorPlataforma: function (plataforma: string) {
        const colores: Record<string, string> = {
            pc: 'dark',
            playstation: 'primary',
            xbox: 'success',
            nintendo_switch: 'danger',
            mobile: 'warning',
        };
        return colores[plataforma] || 'secondary';
    },
    colorGenero: function (index: number) {
        const colores = ['primary', 'success', 'danger', 'warning', 'info', 'dark'];
        return colores[index % colores.length];
    },
};
