import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "./page";
import axios from "axios";
import { useRouter } from "next/navigation";

// Mock modules
jest.mock("axios");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("RegisterPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (axios.post as jest.Mock).mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });

  it("validates password mismatch", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "mismatch" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("submits valid form data", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/register/"),
        {
          username: "newuser",
          email: "test@example.com",
          password: "password123",
          password2: "password123",
        }
      );
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });
});
