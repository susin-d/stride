import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react'

export function ProfileMenu({ user, isOpen, onToggle, onNavigate, onSignOut }) {
  return (
    <div className="profile-menu">
      <button
        className="profile-button"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.fullName}
            className="avatar avatar-sm"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fb = e.currentTarget.nextElementSibling
              if (fb) fb.style.display = 'grid'
            }}
          />
        ) : null}
        <span className={`avatar ${user.photoURL ? 'avatar-fallback' : ''}`}>
          {user.initials}
        </span>
        <span className="profile-name">{user.firstName}</span>
        <ChevronDown className={isOpen ? 'chevron-open' : ''} size={15} />
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-heading">
            <strong>{user.fullName}</strong>
            <span>{user.email}</span>
          </div>
          <div className="profile-dropdown-links">
            <button onClick={() => onNavigate('profile')}>
              <UserRound size={16} />
              Profile
            </button>
            <button onClick={() => onNavigate('setting')}>
              <Settings size={16} />
              Settings
            </button>
            <div className="profile-dropdown-divider" />
            <button onClick={onSignOut} className="sign-out-button">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
