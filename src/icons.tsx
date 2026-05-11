export const Icon = ({
  children,
  size = 16,
}: {
  children: React.ReactNode
  size?: number
}) => (
  <svg
    className="icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const IconArrowLeft = () => (
  <Icon>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
)

export const IconPause = () => (
  <Icon>
    <path d="M9 6v12" />
    <path d="M15 6v12" />
  </Icon>
)

export const IconPlay = () => (
  <Icon>
    <path d="M10 8l8 4-8 4V8z" />
  </Icon>
)

export const IconSettings = () => (
  <Icon>
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
    <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.4-2.3.7a7.7 7.7 0 0 0-1.7-1l-.4-2.4h-4l-.4 2.4a7.7 7.7 0 0 0-1.7 1l-2.3-.7-2 3.4 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.7a7.7 7.7 0 0 0 1.7 1l.4 2.4h4l.4-2.4a7.7 7.7 0 0 0 1.7-1l2.3.7 2-3.4-2-1.2z" />
  </Icon>
)

export const IconUndo = () => (
  <Icon>
    <path d="M9 14l-4-4 4-4" />
    <path d="M5 10h8a6 6 0 0 1 0 12h-1" />
  </Icon>
)

export const IconEraser = () => (
  <Icon>
    <path d="M20 20H8l-4-4 10-10 6 6-6 6" />
    <path d="M14 14l-6 6" />
  </Icon>
)

export const IconPencil = () => (
  <Icon>
    <path d="M12 20h9" />
    <path d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z" />
  </Icon>
)

export const IconHint = () => (
  <Icon>
    <path d="M12 2a7 7 0 0 0-4 12c.6.4 1 1 1 1.7V17h6v-1.3c0-.7.4-1.3 1-1.7A7 7 0 0 0 12 2z" />
    <path d="M9 21h6" />
  </Icon>
)

