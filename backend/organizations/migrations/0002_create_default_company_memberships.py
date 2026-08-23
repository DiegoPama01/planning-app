from django.db import migrations
from django.utils.text import slugify


def create_default_company_memberships(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Company = apps.get_model("organizations", "Company")
    CompanyMembership = apps.get_model("organizations", "CompanyMembership")

    for user in User.objects.all():
        if CompanyMembership.objects.filter(user=user).exists():
            continue

        base_name = (
            user.first_name or user.email.split("@", 1)[0]
        ).strip() or "Workspace"
        company_name = f"{base_name.title()} Workspace"
        slug_base = slugify(base_name) or "workspace"
        slug = f"{slug_base}-{user.id}"
        counter = 1

        while Company.objects.filter(slug=slug).exists():
            counter += 1
            slug = f"{slug_base}-{user.id}-{counter}"

        company = Company.objects.create(
            name=company_name,
            slug=slug,
        )
        CompanyMembership.objects.create(
            company=company,
            user=user,
            role="owner",
        )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_remove_user_username_alter_user_email"),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            create_default_company_memberships, migrations.RunPython.noop
        ),
    ]
