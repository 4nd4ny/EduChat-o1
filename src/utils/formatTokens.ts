// Fonction pour formater les tokens en kt, mt, gt, etc.
export const formatTokens = (totalTokens: number): string => {
    // Définition des seuils pour les valeurs des unités
    const kilo = 1_000;          // 10^3
    const mega = 1_000_000;      // 10^6
    const giga = 1_000_000_000;  // 10^9
    const tera = 1_000_000_000_000;  // 10^12
    const peta = 1_000_000_000_000_000;  // 10^15
    let formattedValue: string;
    if (totalTokens >= peta) {
        formattedValue = `${(totalTokens / peta).toFixed(2)} TkP`; // Petatokens
    } else if (totalTokens >= tera) {
        formattedValue = `${(totalTokens / tera).toFixed(2)} TkT`; // Teratokens
    } else if (totalTokens >= giga) {
        formattedValue = `${(totalTokens / giga).toFixed(2)} TkG`; // Gigatokens
    } else if (totalTokens >= mega) {
        formattedValue = `${(totalTokens / mega).toFixed(2)} TkM`; // Megatokens
    } else if (totalTokens >= kilo) {
        formattedValue = `${(totalTokens / kilo).toFixed(2)} TkK`; // Kilotokens
    } else {
        formattedValue = `${totalTokens} tokens`; // Tokens (pour les petites valeurs)
    }
    return formattedValue;
};