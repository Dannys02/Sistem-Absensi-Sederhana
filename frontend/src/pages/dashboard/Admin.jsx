import { useAuth } from "../../context/AuthContext";

function Admin() {
    const { user } = useAuth();
    return <h1>Halo Admin</h1>;
    
}

export default Admin;