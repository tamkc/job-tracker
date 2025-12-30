import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfilePage from './page'
import useAxiosAuth from '@/hooks/useAxiosAuth'

// Mock the hooks
jest.mock('@/hooks/useAxiosAuth')
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock lucide-react icons to avoid issues
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader" />,
  Upload: () => <div data-testid="upload" />,
}))

describe('ProfilePage', () => {
  const mockAxios = {
    get: jest.fn(),
    put: jest.fn(),
  }

  beforeEach(() => {
    (useAxiosAuth as jest.Mock).mockReturnValue(mockAxios)
    mockAxios.get.mockResolvedValue({
      data: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        bio: 'Hello world',
        phone_number: '1234567890',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        portfolio_url: 'https://johndoe.com',
        notification_email_updates: true,
        notification_job_alerts: false,
      },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders user profile data', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    })
  })

  it('updates profile data on submit', async () => {
    mockAxios.put.mockResolvedValue({
        data: {
            first_name: 'John Updated',
            last_name: 'Doe',
            email: 'john@example.com',
            username: 'johndoe',
            bio: 'Hello world',
            phone_number: '1234567890',
            linkedin_url: 'https://linkedin.com/in/johndoe',
            portfolio_url: 'https://johndoe.com',
            notification_email_updates: true,
            notification_job_alerts: false,
        }
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const firstNameInput = screen.getByLabelText('First Name')
    fireEvent.change(firstNameInput, { target: { value: 'John Updated' } })

    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockAxios.put).toHaveBeenCalledWith(
        '/profile/',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      )
    })
  })
})
