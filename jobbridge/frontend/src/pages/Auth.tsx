import { useState } from "react";
import type { FormEvent } from "react";

type AuthProps = {
  setPage: (page: string) => void;
};

type User = {
  id: string | number;
  name: string;
  email: string;
  role: string;
  skills?: string;
};

export default function Auth({ setPage }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState("");
  const [role, setRole] = useState("STUDENT");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("");
    setLoading(true);

    let query = "";
    let variables: Record<string, string> = {};

    if (isLogin) {
      query =
        "mutation Login($email: String!, $password: String!) {" +
        " login(email: $email, password: $password) {" +
        " id name email role skills" +
        " }" +
        "}";

      variables = {
        email: email.trim(),
        password: password
      };
    } else {
      query =
        "mutation Register(" +
        "$name: String!, " +
        "$email: String!, " +
        "$password: String!, " +
        "$role: String!, " +
        "$skills: String" +
        ") {" +
        " register(" +
        " name: $name" +
        " email: $email" +
        " password: $password" +
        " role: $role" +
        " skills: $skills" +
        " ) {" +
        " id name email role skills" +
        " }" +
        "}";

      variables = {
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: role,
        skills: skills.trim()
      };
    }

    try {
      const response = await fetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query,
          variables: variables
        })
      });

      if (!response.ok) {
        throw new Error("Server error: " + response.status);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        const errorMessage =
          result.errors[0]?.message || "Something went wrong.";

        const lowerMessage = errorMessage.toLowerCase();

        if (
          lowerMessage.includes("already registered") ||
          lowerMessage.includes("already exists") ||
          lowerMessage.includes("duplicate") ||
          lowerMessage.includes("users_email_key") ||
          lowerMessage.includes("already_exists")
        ) {
          throw new Error(
            "This email is already registered. Please use another email or login."
          );
        }

        throw new Error(errorMessage);
      }

      const user: User | null = isLogin
        ? result.data?.login
        : result.data?.register;

      if (!user) {
        throw new Error(
          isLogin
            ? "Login failed. Please check your email and password."
            : "Registration failed. Please try again."
        );
      }

      localStorage.setItem("userId", String(user.id));
      localStorage.setItem("userName", user.name || "");
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userRole", user.role || "STUDENT");
      localStorage.setItem("userSkills", user.skills || "");

      setMessage(
        isLogin
          ? "Login successful!"
          : "Registration successful!"
      );

      setMessageType("success");

      setTimeout(() => {
        if (user.role === "RECRUITER") {
          setPage("recruiter-dashboard");
        } else {
          setPage("jobs");
        }
      }, 700);
    } catch (error: unknown) {
      console.error("Authentication error:", error);

      let errorMessage =
        "Something went wrong. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function switchToRegister() {
    setIsLogin(false);
    setMessage("");
    setMessageType("");
    setName("");
    setEmail("");
    setPassword("");
    setSkills("");
    setRole("STUDENT");
  }

  function switchToLogin() {
    setIsLogin(true);
    setMessage("");
    setMessageType("");
    setName("");
    setEmail("");
    setPassword("");
    setSkills("");
    setRole("STUDENT");
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h2>
          {isLogin
            ? "Welcome Back"
            : "Create Your Account"}
        </h2>

        <p className="auth-subtitle">
          {isLogin
            ? "Login to continue to JobBridge"
            : "Register for JobBridge"}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />

              <label>Account Type</label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
                required
              >
                <option value="STUDENT">
                  Student / Job Seeker
                </option>

                <option value="RECRUITER">
                  Recruiter
                </option>
              </select>

              <label>Skills</label>

              <input
                type="text"
                placeholder="Python, Java, SQL"
                value={skills}
                onChange={(event) =>
                  setSkills(event.target.value)
                }
              />
            </>
          )}

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Login"
                : "Register"}
          </button>
        </form>

        {message && (
          <p
            className={
              "auth-message " +
              (messageType === "error"
                ? "auth-error"
                : "auth-success")
            }
          >
            {message}
          </p>
        )}

        <div className="auth-switch">
          {isLogin ? (
            <>
              Don't have an account?{" "}

              <button
                type="button"
                onClick={switchToRegister}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}

              <button
                type="button"
                onClick={switchToLogin}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}