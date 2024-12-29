import React, { useEffect } from "react";
import Home from "./pages/Home"
import ContactUs from "./pages/ContactUs"
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

    // useEffect(() => {
    //     // Create a <style> element
    //     const style = document.createElement('style');
    //     // Set the innerHTML with the CSS
    //     style.innerHTML = `* {
    //       margin: 0;
    //       padding: 0;
    //       box-sizing: border-box;
    //     }`;
    //     // Append the style to the head of the document
    //     document.head.appendChild(style);
      
    //     // Cleanup function to remove the style element when the component is unmounted
    //     return () => {
    //       document.head.removeChild(style);
    //     };
    //   }, []);
    return <RouterProvider router={routes} />;
}