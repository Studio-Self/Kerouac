import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["identifier", "identifierHelp", "credentialsSection", "credentialsHelp"]

  connect() {
    this.updateHelpText()
  }

  platformChanged(event) {
    this.updateHelpText(event.target.value)
  }

  updateHelpText(platform = null) {
    if (!platform) {
      const select = document.querySelector('select[name="connection[platform]"]')
      platform = select?.value
    }

    const identifierHelp = this.hasIdentifierHelpTarget ? this.identifierHelpTarget : null
    const credentialsSection = this.hasCredentialsSectionTarget ? this.credentialsSectionTarget : null
    const credentialsHelp = this.hasCredentialsHelpTarget ? this.credentialsHelpTarget : null

    switch (platform) {
      case "substack":
        if (identifierHelp) {
          identifierHelp.textContent = "Enter your Substack subdomain (e.g., 'yourname' from yourname.substack.com)"
        }
        if (credentialsSection) {
          credentialsSection.classList.add("hidden")
        }
        break

      case "ghost":
        if (identifierHelp) {
          identifierHelp.textContent = "Enter your Ghost blog URL (e.g., your-blog.ghost.io)"
        }
        if (credentialsSection) {
          credentialsSection.classList.remove("hidden")
        }
        if (credentialsHelp) {
          credentialsHelp.textContent = 'Format: {"api_url": "https://your-blog.ghost.io", "admin_api_key": "key:secret"}'
        }
        break

      case "medium":
        if (identifierHelp) {
          identifierHelp.textContent = "Enter your Medium username (with or without @)"
        }
        if (credentialsSection) {
          credentialsSection.classList.add("hidden")
        }
        break

      default:
        if (identifierHelp) {
          identifierHelp.textContent = "Enter your platform identifier (username, subdomain, or URL)."
        }
        if (credentialsSection) {
          credentialsSection.classList.remove("hidden")
        }
    }
  }
}
