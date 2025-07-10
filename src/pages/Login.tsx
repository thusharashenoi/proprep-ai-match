import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  // On mount, redirect to signup
  useEffect(() => {
    navigate("/signup");
  }, [navigate]);

  return null;
};

export default Login;
