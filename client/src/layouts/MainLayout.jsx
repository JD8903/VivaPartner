import Navbar from "../components/Landing/Navbar/Navbar";
import Footer from "../components/Landing/Footer/Footer";

const MainLayout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main>
                {children}
            </main>
            <Footer />
        </>
    );
};

export default MainLayout;