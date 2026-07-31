

def first(func):

    def illa():
        print("mAaster")
        func()

    return illa

def b():
    print("God")

no=first(b)
no()