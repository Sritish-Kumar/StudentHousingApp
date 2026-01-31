export const formatInstruction = (step) => {
    if (!step || !step.maneuver) return "Continue";

    const { type, modifier, name } = step.maneuver;
    const roadName = name ? ` onto ${name}` : "";

    switch (type) {
        case "depart":
            return `Head ${modifier || "forward"}`;
        case "arrive":
            return "You have arrived at your destination";
        case "turn":
            if (modifier) {
                const direction = modifier.replace("_", " ");
                return `Turn ${direction}${roadName}`;
            }
            return `Turn${roadName}`;
        case "merge":
            return `Merge ${modifier || ""}${roadName}`;
        case "on ramp":
            return `Take the ramp${roadName}`;
        case "off ramp":
            return `Take the exit${roadName}`;
        case "fork":
            return `Keep ${modifier || ""}${roadName}`;
        case "end of road":
            return `Turn ${modifier || ""}${roadName}`;
        case "continue":
        case "new name":
            return roadName ? `Continue${roadName}` : "Continue straight";
        case "roundabout":
            return `Enter roundabout and take exit ${step.maneuver.exit || 1}`;
        case "rotary":
            return `Enter rotary and take exit ${step.maneuver.exit || 1}`;
        case "roundabout turn":
            return `At roundabout, turn ${modifier}`;
        case "notification":
            return `Continue${roadName}`;
        default:
            return step.maneuver.instruction || `Continue${roadName}`;
    }
};

export const getTurnIcon = (modifier) => {
    switch (modifier) {
        case "left":
        case "sharp left":
        case "slight left":
            return "⬅️";
        case "right":
        case "sharp right":
        case "slight right":
            return "➡️";
        case "straight":
            return "⬆️";
        case "uturn":
            return "U";
        default:
            return "⬆️";
    }
};
