from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("workforce", "0002_planningassignment"),
    ]

    operations = [
        migrations.AddField(
            model_name="planningassignment",
            name="note",
            field=models.TextField(blank=True, default=""),
        ),
    ]
