#!/bin/bash

# LayerROI Frontend Deployment Script
# Supports: Vercel, Docker, and Static Hosting

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     LayerROI Frontend - Deployment Script v1.0             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")/frontend" || exit 1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}→ Checking prerequisites...${NC}"

    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js is not installed${NC}"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo -e "${RED}✗ npm is not installed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Prerequisites met${NC}"
}

# Verify build
verify_build() {
    echo -e "${BLUE}→ Verifying production build...${NC}"

    if [ ! -d "build" ]; then
        echo -e "${RED}✗ Build directory not found${NC}"
        echo "  Run: npm run build"
        exit 1
    fi

    if [ ! -f "build/index.html" ]; then
        echo -e "${RED}✗ Build incomplete${NC}"
        echo "  Run: npm run build"
        exit 1
    fi

    local build_size=$(du -sh build | cut -f1)
    echo -e "${GREEN}✓ Build verified (size: $build_size)${NC}"
}

# Deploy to Vercel
deploy_vercel() {
    echo ""
    echo -e "${BLUE}→ Deploying to Vercel...${NC}"

    if ! command -v vercel &> /dev/null; then
        echo "  Installing Vercel CLI..."
        npm install -g vercel@latest
    fi

    echo -e "${YELLOW}! Note: You'll need to authenticate with Vercel${NC}"
    echo ""

    if [ -z "$VERCEL_TOKEN" ]; then
        echo -e "${YELLOW}! VERCEL_TOKEN not set. Please authenticate:${NC}"
        vercel login || {
            echo -e "${RED}✗ Vercel authentication failed${NC}"
            exit 1
        }
    fi

    echo "  Deploying..."
    vercel --prod --prebuilt --yes

    echo -e "${GREEN}✓ Deployment to Vercel complete${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "  1. Verify deployment: https://layerroi.vercel.app"
    echo "  2. Run smoke tests"
    echo "  3. Monitor in Vercel dashboard"
}

# Deploy with Docker
deploy_docker() {
    echo ""
    echo -e "${BLUE}→ Building Docker image...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker is not installed${NC}"
        exit 1
    fi

    local image_name="layerroi-frontend:latest"

    docker build -t "$image_name" .

    echo -e "${GREEN}✓ Docker image built: $image_name${NC}"
    echo ""
    echo -e "${GREEN}To run the container:${NC}"
    echo "  docker run -p 3000:3000 $image_name"
    echo ""
    echo -e "${GREEN}To push to registry:${NC}"
    echo "  docker tag $image_name <your-registry>/$image_name"
    echo "  docker push <your-registry>/$image_name"
}

# Deploy to static hosting
deploy_static() {
    echo ""
    echo -e "${BLUE}→ Preparing static files for deployment...${NC}"

    local archive="layerroi-frontend-build.tar.gz"

    tar czf "$archive" build/

    echo -e "${GREEN}✓ Static files ready for deployment${NC}"
    echo ""
    echo -e "${GREEN}Archive created: $archive${NC}"
    echo ""
    echo -e "${GREEN}Deployment options:${NC}"
    echo "  • AWS S3: aws s3 sync build/ s3://your-bucket/"
    echo "  • CloudFlare: wrangler publish"
    echo "  • GitHub Pages: Copy build/ to gh-pages branch"
    echo "  • Netlify: netlify deploy --prod --dir=build"
}

# Main menu
show_menu() {
    echo -e "${BLUE}Choose deployment platform:${NC}"
    echo ""
    echo "  1) Vercel (Recommended)"
    echo "  2) Docker"
    echo "  3) Static Hosting (S3, CloudFlare, etc.)"
    echo "  4) Exit"
    echo ""
    read -p "Enter choice [1-4]: " choice

    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_docker
            ;;
        3)
            deploy_static
            ;;
        4)
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            show_menu
            ;;
    esac
}

# Main execution
main() {
    check_prerequisites

    # Build if needed
    if [ ! -d "build" ] || [ -z "$(ls -A build)" ]; then
        echo ""
        echo -e "${BLUE}→ Building frontend...${NC}"
        npm install
        npm run build
    fi

    verify_build

    echo ""
    show_menu

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          Deployment process complete!                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
}

# Run main
main "$@"
