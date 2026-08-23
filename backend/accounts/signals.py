from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import User
from organizations.bootstrap import ensure_user_company_membership


@receiver(post_save, sender=User)
def bootstrap_user_company(sender, instance, created, **kwargs):
    if created:
        ensure_user_company_membership(instance)
