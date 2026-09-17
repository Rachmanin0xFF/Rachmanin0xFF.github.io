
letters_per_button = [0, 3, 3, 3, 3, 3, 4, 3, 4]

alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

buttons = []
index = 0
for letters_count in letters_per_button:
    buttons.append(alphabet[index:index + letters_count])
    index += letters_count

buttons_dict = dict(zip(range(1, len(buttons) + 1), buttons))
letter_map = ()

for button, letters in buttons_dict.items():
    for i in range(len(letters)):
        letter_map += ((letters[i], str(button) * (i + 1)),)

letter_map = dict(letter_map)
letter_map['#'] = '#'
letter_map['*'] = '*'

def translate(text):
    return "".join(letter_map.get(char.upper(), char) for char in text)
# 34.7667, -111.93597
print(translate("THIRTYFOURPOINTSEVENSIXSIXSEVEN*NEGATIVEONEHUNDREDELEVENPOINTNINETHREEFIVENINESEVEN"))