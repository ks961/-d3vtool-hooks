import Home from "./pages/Home";
import ContactUs from "./pages/ContactUs";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const routes = createBrowserRouter([
    {
        path: "/",
        element: <Home />
    },
    {
        path: "/contact-us",
        element: <ContactUs />
    },
])

export default function App() {
    return <RouterProvider router={routes} />;
}