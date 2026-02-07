import "./globals.css";
import "./styles/chat-animations.css";
import Providers from "./components/Providers";
import ChatIcon from "./components/ChatIcon";

export const metadata = {
  title: "Student Housing App",
  description: "Student Housing Platform",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <ChatIcon />
        </Providers>
      </body>
    </html>
  );
}
