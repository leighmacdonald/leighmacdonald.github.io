Title: Configure Synergy Forward/Back Mouse Buttons
Date: 2018-03-11 06:34
Category: Utilities
Tags: Windows, Linux, Synergy

[Syngery](https://symless.com/synergy) is a software solution that allows sharing of your mouse
and keyboard across multiple computers and operating systems. It
even has functionality to allow copying and pasting between those
systems seamlessly.

For reasons im not sure of, when trying to use the client with some linux
systems, it does not properly support the forward and back mouse buttons 
(mouse4/mouse5) commonly used for web browsing navigation. To enable this 
functionality i had to edit the synergy server configuration by hand with a 
couple extra settings.

Below is an excerpt of the config file with the two required lines changed
under `section: options`

    #!bash hl_lines="9 10"
    section: options
    	heartbeat = 5000
    	relativeMouseMoves = false
    	screenSaverSync = true
    	win32KeepForeground = false
    	clipboardSharing = true
    	switchCorners = none 
    	switchCornerSize = 0
    	mousebutton(4) = keystroke(WWWBack)
    	mousebutton(5) = keystroke(WWWForward)
    end  

For reference i am using a windows based "server" and linux based "clients" using
Synergy 1.8. I have not yet upgraded to a 2.x license as it is still lacking in features 
compared to the 1.x branch, so i am unsure is this is something that's been fixed in 2.x.