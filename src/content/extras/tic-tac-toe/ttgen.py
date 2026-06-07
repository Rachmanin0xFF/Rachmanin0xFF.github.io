from PIL import Image, ImageDraw
from dataclasses import dataclass, field

# If this is set to true, once the bot is in an absolutely-winning state, it
# will pick the win path that takes the MOST turns to complete.
BE_A_DICK = True

def validate_state(state):
    if len(state) != 9:
        # board too big / small
        return False

    symbols = {"X", "O", "_"}
    charset = set(state)
    if not charset.issubset(symbols):
        # too many players : )
        return False
    if abs(state.count("O") - state.count("X")) >= 2:
        # somebody skipped a turn...
        return False
    return True

def draw_board(state_serialized, size=300):
    if not validate_state(state_serialized):
        raise ValueError(f"{state_serialized} is not a valid tic-tac-toe board!")
    
    state = [[state_serialized[0], state_serialized[1], state_serialized[2]],
             [state_serialized[3], state_serialized[4], state_serialized[5]],
             [state_serialized[6], state_serialized[7], state_serialized[8]]]
    
    img = Image.new("RGB", (size, size), "white")
    d = ImageDraw.Draw(img)
    cell = size // 3

    for i in (1, 2):                      # grid lines
        d.line([(cell*i, 0), (cell*i, size)], fill="black", width=3)
        d.line([(0, cell*i), (size, cell*i)], fill="black", width=3)

    pad = cell // 4
    for r in range(3):
        for c in range(3):
            x0, y0 = c*cell + pad, r*cell + pad
            x1, y1 = (c+1)*cell - pad, (r+1)*cell - pad
            if state[r][c] == "O":
                d.ellipse([x0, y0, x1, y1], outline="blue", width=4)
            elif state[r][c] == "X":
                d.line([(x0, y0), (x1, y1)], fill="red", width=4)
                d.line([(x0, y1), (x1, y0)], fill="red", width=4)
    return img

def state_to_pretty_string(state):
    s = state.replace("_", " ")
    return f"""
┌───┬───┬───┐
│ {" | ".join(s[:3])} │
├───┼───┼───┤
│ {" | ".join(s[3:6])} │
├───┼───┼───┤
│ {" | ".join(s[6:9])} │
└───┴───┴───┘
        """

# board layout:
# 0 1 2
# 3 4 5
# 6 7 8

# state string is just 01233456789

# I considered using bitboards here, but for tictactoe, and in python... ehhhh....
def is_win(state):
    # there's not even ten of them lol. just write it out
    winning_combos = [[0, 1, 2], # horizontal
                      [3, 4, 5],
                      [6, 7, 8],

                      [0, 3, 6], # vertical
                      [1, 4, 7],
                      [2, 5, 8],

                      [0, 4, 8], # diagonal
                      [2, 4, 6]]
    for x, y, z in winning_combos:
        selection = f"{state[x]}{state[y]}{state[z]}"
        if selection == "XXX":
            return "X"
        elif selection == "OOO":
            return "O"
    return "_" # I'm overloading this symbol to mean "nobody wins"... maybe stupid

from enum import Enum

class Ternary(Enum):
    YES = 1
    MAYBE = 2
    NO = 3

def ternary_or(a, b):
    return [Ternary.YES, Ternary.MAYBE, Ternary.NO][min(a.value, b.value) - 1]
def ternary_and(a, b):
    return [Ternary.YES, Ternary.MAYBE, Ternary.NO][max(a.value, b.value) - 1]
def ternary_not(a):
    return [Ternary.YES, Ternary.MAYBE, Ternary.NO][4 - a.value]
def ternary_mix(a, b):
    x = a.value + b.value
    if x == 2:
        return Ternary.YES
    elif x == 6:
        return Ternary.NO
    return Ternary.MAYBE

def apply_repeated_binary_operation(func, vals: list):
    if len(vals) == 0:
        raise ValueError("Cannot appply operation to empty array!")
    res = vals[0]
    for val in vals[1:]:
        res = func(res, val)
    return res;

@dataclass
class GamePlayerState:
    win: Ternary = Ternary.NO
    tie: Ternary = Ternary.NO
    time_to_win: int = 0

    def get_priority(self) -> float:
        """This return a score (lower is better) that matches *my* preferences when I play tic-tac-toe."""
        score = (self.win.value - 1) * 3 + self.tie.value
        if score == 7:
            score = 5
        elif score == 5 or score == 6:
            score += 1
        return score - self.time_to_win*0.01 * (1 if BE_A_DICK else -1)
    
def increment_age(c: GamePlayerState) -> GamePlayerState:
    return GamePlayerState(c.win, c.tie, c.time_to_win + 1)

from dataclasses import dataclass, field
import dataclasses

@dataclass(unsafe_hash=True) # frozen so we can make sets
class RichState:
    state: str
    parent_states: str = field(compare=False)
    child_states: str = field(compare=False)
    win: str
    level: int
    who_just_went: str

    x_state: GamePlayerState = field(default_factory=GamePlayerState)
    o_state: GamePlayerState = field(default_factory=GamePlayerState)

    suggested_o_choice: str = ""
    suggested_x_choice: str = ""

    def __repr__(self):
        fields_str = ", ".join(
            f"\n{f.name}={getattr(self, f.name)!r}" 
            for f in dataclasses.fields(self)
        )
        return "---\n" + fields_str + "\n" + state_to_pretty_string(self.state) + "\n---"

boards = [RichState(
            state="_________",
            parent_states="",
            child_states="",
            win="_",
            level=0,
            who_just_went="O",
        )]

current_boards = boards.copy()
level = 0
turn = 'X'
while True:
    child_states = []
    j = 0
    for board in current_boards:
        # find possible child states for this board
        children = []
        for i in range(0, 9):
            if board.state[i] == "_" and board.win == "_":
                updated_state = board.state[:i] + turn + board.state[i+1:]
                children.append((updated_state, board.state))
                j+=1
        board.child_states = " ".join([x[0] for x in children])
        child_states.extend(children)
    if j==0:
        break
    
    # go through all children for ALL boards (potentially including duped states)
    # and agg the parents, keyed by child ID
    family_registry = {}
    for state, parent_state in child_states:
        if state in family_registry:
            family_registry[state].append(parent_state)
        else:
            family_registry[state] = [parent_state]

    # now we de-dupe the children and include with the aggregated list of parents
    new_boards = []
    for state in set([state for state, _ in child_states]):
        does_it_win = is_win(state)
        parents = family_registry[state]
        new_boards.append(RichState(
            state=state,
            parent_states=" ".join(parents),
            child_states = "",
            win=does_it_win,
            level=board.level + 1,
            who_just_went=turn,
        ))
    
    # toggle
    if turn == 'O':
        turn = 'X'
    elif turn == 'X':
        turn = 'O'
    
    boards.extend(list(new_boards))
    current_boards = new_boards

boards_dict = dict(zip([b.state for b in boards], boards))

# now we prune it...
# specifically, we propagate up the tree level-by-level

# note that n_o_wins and n_x_wins contain the number of *paths* to victory
# (which is far higher than the number of actual victory states!)

max_depth = max([b.level for b in boards])

win = GamePlayerState(win=Ternary.YES, tie=Ternary.NO)
lose = GamePlayerState(win=Ternary.NO, tie=Ternary.NO)
tie = GamePlayerState(win=Ternary.NO, tie=Ternary.YES)
for board in boards:
    if board.win == 'X':
        board.x_state = win
        board.o_state = lose
    elif board.win == 'O':
        board.x_state = lose
        board.o_state = win
    elif board.win == '_':
        board.x_state = tie
        board.o_state = tie

def join_turntaker_states(states: list[GamePlayerState]):
    can_win = apply_repeated_binary_operation(ternary_or, [x.win for x in states])
    can_tie = apply_repeated_binary_operation(ternary_or, [x.tie for x in states])
    
    return GamePlayerState(win=can_win, tie=can_tie)
    
def join_enemy_states(states):
    can_win = apply_repeated_binary_operation(ternary_mix, [x.win for x in states])
    can_tie = apply_repeated_binary_operation(ternary_mix, [x.tie for x in states])
    
    return GamePlayerState(win=can_win, tie=can_tie)

for i in range(max_depth, 0, -1):
    j = 0
    for board in boards:
        if board.level == i and board.child_states:
            child_names = board.child_states.split(" ")

            children_x_states = [boards_dict[key].x_state for key in child_names]
            children_o_states = [boards_dict[key].o_state for key in child_names]

            children_x_state_scores = [state.get_priority() for state in children_x_states]
            children_o_state_scores = [state.get_priority() for state in children_o_states]

            if board.who_just_went == 'X':

                choice_of_o = children_o_state_scores.index(min(children_o_state_scores))
                board.x_state = increment_age(children_x_states[choice_of_o])
                board.o_state = increment_age(children_o_states[choice_of_o])

                board.suggested_o_choice = child_names[choice_of_o]
            elif board.who_just_went == 'O':

                choice_of_x = children_x_state_scores.index(min(children_x_state_scores))
                board.x_state = increment_age(children_x_states[choice_of_x])
                board.o_state = increment_age(children_o_states[choice_of_x])

                board.suggested_x_choice = child_names[choice_of_x]
            
            if board.state == "OXX_O_X__":
                print("\n\n\n\n========================")
                for child in child_names:
                    print(boards_dict[child])
                print(board)
                print(f"{children_o_states}\n{children_o_state_scores}\n{children_o_states}")
                print(choice_of_x)
                
                
boards_dict = dict(zip([b.state for b in boards], boards))

boards_filtered = []
working_arr = [boards[0]]

while len(working_arr) > 0:
    new_working_set = set()
    for board in working_arr:
        if board.who_just_went == 'X':
            new_working_set.add(board.suggested_o_choice)
        else:
            if board.child_states != "":
                new_working_set.update(board.child_states.split(" "))
    
    boards_filtered.extend(working_arr)
    
    working_arr = [boards_dict[k] for k in new_working_set if k != '']


def gen_json(board_list, filename):
    for_json = {
        "boards":
        {
            b.state: {
                "parents": b.parent_states.split(" "),
                "children": b.child_states.split(" "),
                "x_win": b.win == "X",
                "o_win": b.win == "O",
                "moves_so_far": b.level,
                "who_just_went": b.who_just_went,
                "suggested_move_for_x": b.suggested_x_choice,
                "suggested_move_for_o": b.suggested_o_choice,
                "pretty_string": state_to_pretty_string(b.state),

            }
        for b in board_list
        }
    }

    import json
    with open(filename, "w") as file:
        json.dump(for_json, file, indent=4)
    
    print(f"Saved {len(board_list)} board states to {filename}")


gen_json(boards, "ttt.json")
gen_json(boards_filtered, "ttt_o_soln.json")

