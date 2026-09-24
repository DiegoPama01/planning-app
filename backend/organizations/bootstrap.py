from django.utils.text import slugify

from organizations.models import Company, CompanyMembership


def ensure_user_company_membership(user):
    if user.company_memberships.exists():
        return

    base_name = (user.first_name or user.email.split("@", 1)[0]).strip() or "Workspace"
    company_name = f"{base_name.title()} Workspace"
    company_slug = _build_unique_slug(base_name, user.id)

    company = Company.objects.create(
        name=company_name,
        slug=company_slug,
    )
    CompanyMembership.objects.create(
        company=company,
        user=user,
        role=CompanyMembership.Role.ADMIN,
    )


def _build_unique_slug(base_name, user_id):
    slug_base = slugify(base_name) or "workspace"
    slug = f"{slug_base}-{user_id}"
    counter = 1

    while Company.objects.filter(slug=slug).exists():
        counter += 1
        slug = f"{slug_base}-{user_id}-{counter}"

    return slug
