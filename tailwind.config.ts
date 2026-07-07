import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B211D",
        pine: "#27332C",
        "pine-edge": "#35443B",
        parchment: "#E9DCC0",
        "parchment-deep": "#CDB98F",
        ember: "#D2913F",
        "ember-bright": "#E8AC5B",
        moss: "#8AAE74",
        mist: "#9AA9A0",
        faded: "#6E7C74"
      },
      fontFamily: {
        book: ['"Iowan Old Style"', '"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        instrument: ['"SFMono-Regular"', "ui-monospace", "Menlo", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};
export default config;
