module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        realm: {
          bg: "#0B0F1A",
          glass: "rgba(30, 42, 63, 0.6)",
          primary: "#00CFFF",
          secondary: "#6B2FFF",
          text: "#FFFFFF",
          muted: "#C4CADC",
        },
      },
      backgroundImage: {
        "button-gradient": "linear-gradient(90deg, #00CFFF 0%, #6B2FFF 100%)",
      },
      borderColor: {
        glass: "rgba(255, 255, 255, 0.1)",
      },
    },
  },
};
