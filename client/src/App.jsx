import { useEffect } from "react";
import API from "../../server/services/api"

function App() {

    useEffect(() => {
        API.get("/")
            .then((res) => console.log(res.data))
            .catch((err) => console.error(err));
    }, []);

    return (
        <h1>VivaPartner</h1>
    );
}

export default App;