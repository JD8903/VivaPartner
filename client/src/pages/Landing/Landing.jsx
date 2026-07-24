import MainLayout from "../../layouts/MainLayout";

import Hero from "../../components/Landing/Hero/Hero";
import Features from "../../components/Landing/Features/Features";
import HowItWorks from "../../components/Landing/HowItWorks/HowItWorks";
import WhyChooseUs from "../../components/Landing/WhyChooseUs/WhyChooseUs";
import TechStack from "../../components/Landing/TechStack/TechStack";
import About from "../../components/Landing/About/About";
import CTA from "../../components/Landing/CTA/CTA";

const Landing = () => {
    return (
        <MainLayout>

            <Hero />

            <Features />

            <HowItWorks />

            <WhyChooseUs />

            <TechStack />

            <About />

            <CTA />

        </MainLayout>
    );
};

export default Landing;