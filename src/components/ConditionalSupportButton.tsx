import { useLocation } from "react-router-dom";
import { SupportButton } from "./establishment/SupportButton";

export const ConditionalSupportButton = () => {
    const location = useLocation();
    const isEstablishmentArea = location.pathname.startsWith("/estabelecimento");
    const isAdminArea = location.pathname.startsWith("/admin");
    const isDriverArea = location.pathname.startsWith("/entregador");

    // Show support button for establishment, admin and driver areas
    if (isEstablishmentArea || isAdminArea || isDriverArea) {
        return <SupportButton />;
    }

    return null;
};
