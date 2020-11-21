# iolike

1. Show help:

```bash
node build/index --help
```

2. Для збірки:

```bash
npm install
npm start
```

Для старту відкрити сторінку, ввести нікнейм в поле і сабмітнути. "постріли" робляться клавішею <kbd>Space</kdb>

Для більш наочної демонстрації роботи сповіщення гравця можна
зменшити параметр `--chunksize` - буде видно, що їжа відображається лише в
поточному та сусідніх чанках

### Формат обміну повідомлень - бінарний

Перший байт повідомлення - його [тип](common/types.ts), після нього йде тіло.

Для прикладу повідомлення з типом `MessageType.SyncEntities`:
перші 4 байти (i32) - n сутностей, що передаються (їжа та гравці)
Далі йдуть n буферів, де в кожному 1 байт описує тип сутності (їжа чи гравець)
а всі інші - інформацію про сутність. Для гравця це 45 байтів, для їжі - 17

| MessageType (u8)  |
|:------------------:|
| Entity count (i32)|
| Entity type (u8)  |
| Entity info (depends on type) |
| ... |
| Entity info (depends on type) |

Для повідомлень без тіла - передається лише 1 байт з його типом
Парсинг та серіалізація описані в [файлі](common/parser.ts).
Серіалізація окремих сутностей - в [entities.ts](common/entities.ts)
