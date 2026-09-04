#!/bin/bash
# =============================================================================
# Mavora Release Script
# Arabic Marketplace Platform - Version Release Automation
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project info
PROJECT_NAME="Mavora"
VERSION_PREFIX="v"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_banner() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}          ${GREEN}$PROJECT_NAME - Release Script${NC}                    ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}          ${YELLOW}Arabic Marketplace Platform (Morocco)${NC}              ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Get current version from package.json
get_current_version() {
    grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/'
}

# Validate version format
validate_version() {
    local version=$1
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?$ ]]; then
        log_error "Invalid version format: $version"
        log_error "Expected format: X.Y.Z or X.Y.Z-alpha.1"
        exit 1
    fi
}

# Check if git is clean
check_git_clean() {
    if [[ -n $(git status --porcelain) ]]; then
        log_error "Working directory is not clean!"
        log_error "Please commit or stash your changes first."
        git status --short
        exit 1
    fi
}

# Check if on main branch
check_branch() {
    local branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$branch" != "main" && "$branch" != "master" ]]; then
        log_warning "You are not on main/master branch (current: $branch)"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Run tests before release
run_tests() {
    log_info "Running tests..."
    npm test -- --run 2>&1
    
    if [[ $? -ne 0 ]]; then
        log_error "Tests failed! Aborting release."
        exit 1
    fi
    log_success "All tests passed!"
}

# Run build before release
run_build() {
    log_info "Running build..."
    npm run build 2>&1
    
    if [[ $? -ne 0 ]]; then
        log_error "Build failed! Aborting release."
        exit 1
    fi
    log_success "Build successful!"
}

# Update version in package.json
update_version() {
    local new_version=$1
    log_info "Updating version to $new_version..."
    
    # Update package.json
    if command -v npm &> /dev/null; then
        npm version $new_version --no-git-tag-version --allow-same-version
    else
        # Manual update if npm not available
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" package.json
    fi
    
    log_success "Version updated to $new_version"
}

# Create git tag
create_tag() {
    local version=$1
    local tag="${VERSION_PREFIX}${version}"
    
    log_info "Creating git tag: $tag"
    git tag -a "$tag" -m "Release $tag"
    
    log_success "Tag created: $tag"
}

# Push to remote
push_changes() {
    local version=$1
    local tag="${VERSION_PREFIX}${version}"
    
    log_info "Pushing to remote..."
    git push origin main
    git push origin "$tag"
    
    log_success "Pushed to remote successfully!"
}

# Generate changelog entry
generate_changelog() {
    local version=$1
    local tag="${VERSION_PREFIX}${version}"
    local date=$(date +"%Y-%m-%d")
    
    log_info "Generating changelog entry for $version..."
    
    # This would typically use a tool like conventional-changelog
    # For now, just show instructions
    log_info "Please update CHANGELOG.md with the following:"
    echo ""
    echo "## [$version] - $date"
    echo ""
    echo "### Added"
    echo "- "
    echo ""
    echo "### Changed"
    echo "- "
    echo ""
    echo "### Fixed"
    echo "- "
}

# Create GitHub release (using gh CLI)
create_github_release() {
    local version=$1
    local tag="${VERSION_PREFIX}${version}"
    
    if command -v gh &> /dev/null; then
        log_info "Creating GitHub release..."
        
        gh release create "$tag" \
            --title "Mavora $version" \
            --notes "## Mavora $version

$(cat CHANGELOG.md | head -50)" \
            --generate-notes 2>/dev/null || true
        
        log_success "GitHub release created!"
    else
        log_warning "gh CLI not found. Create release manually at:"
        log_warning "https://github.com/mavora-ma/mavora/releases/new?tag=$tag"
    fi
}

# Main release function
do_release() {
    local version_type=$1
    local current_version=$(get_current_version)
    local new_version
    
    # Parse current version
    IFS='.' read -r major minor patch <<< "$current_version"
    
    case $version_type in
        major)
            new_version="$((major + 1)).0.0"
            ;;
        minor)
            new_version="$major.$((minor + 1)).0"
            ;;
        patch)
            new_version="$major.$minor.$((patch + 1))"
            ;;
        *)
            new_version=$version_type
            ;;
    esac
    
    validate_version "$new_version"
    
    echo ""
    log_info "Preparing release: $current_version → $new_version"
    echo ""
    
    # Pre-release checks
    check_git_clean
    check_branch
    
    read -p "Continue with release $new_version? (y/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Release cancelled."
        exit 0
    fi
    
    # Run tests and build
    run_tests
    run_build
    
    # Update version
    update_version "$new_version"
    
    # Commit version change
    git add package.json package-lock.json
    git commit -m "chore(release): bump version to $new_version"
    
    # Create tag
    create_tag "$new_version"
    
    # Push
    push_changes "$new_version"
    
    # Generate changelog
    generate_changelog "$new_version"
    
    # Create GitHub release
    create_github_release "$new_version"
    
    echo ""
    log_success "=========================================="
    log_success "Release $new_version completed successfully!"
    log_success "=========================================="
    echo ""
}

# Show usage
show_usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  major         Bump major version (X.0.0)"
    echo "  minor         Bump minor version (x.Y.0)"
    echo "  patch         Bump patch version (x.y.Z)"
    echo "  <version>     Set specific version (e.g., 1.2.3)"
    echo "  current       Show current version"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 patch      # 1.0.0 → 1.0.1"
    echo "  $0 minor      # 1.0.0 → 1.1.0"
    echo "  $0 major      # 1.0.0 → 2.0.0"
    echo "  $0 2.0.0-beta.1  # Set specific pre-release version"
}

# Main entry point
main() {
    show_banner
    
    case "${1:-help}" in
        major|minor|patch)
            do_release "$1"
            ;;
        current|--version|-v)
            echo "Current version: $(get_current_version)"
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            if [[ -n "$1" && "$1" =~ ^[0-9] ]]; then
                do_release "$1"
            else
                show_usage
                exit 1
            fi
            ;;
    esac
}

# Run main function with all arguments
main "$@"
