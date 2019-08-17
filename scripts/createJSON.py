import os
import math

path = 'data'
dataFiles = [ os.path.join( path, y ) for y in sorted([ x[2] for x in os.walk(path)])[0]]

# frame1.txt
#PositionX,PositionY,PositionZ,VelocityX,VelocityY,VelocityZ,Pressure
#-0.0480416,-0.0843047,-0.0160452,-0.00025224,-0.0049289,0.00170138,62.7339
#-0.0484512,-0.0821285,-0.0160873,-0.00150906,-0.00654603,0.00147735,73.4562

# frame2.txt
#PositionX,PositionY,PositionZ,VelocityX,VelocityY,VelocityZ,Pressure
#-0.0480416,-0.0843047,-0.0160452,-0.00025224,-0.0049289,0.00170138,62.7339
#-0.0484512,-0.0821285,-0.0160873,-0.00150906,-0.00654603,0.00147735,73.4562

print(dataFiles)
        
def createJSON(files, maxLines = 50000, lineStep = 10, particleFilter = lambda p: True):

    if len(files) == 0:
        print ("no input files found")
        return 
    i = 0

    frames = [];
    for f in files:
        frames.append([])
        j = 0
        for line in open(f, 'r'):
            if j > 0 and j % lineStep == 0:
                values = [float(x) for x in line.split(',')]

                if particleFilter(values):
                        frames[i].append(values)       
                
            j += 1
            
            if j > maxLines:
                break
        
        i += 1
    return frames
    
x = open("data.json", "w")
x.write(str(createJSON(dataFiles, 50000, lambda v: math.sqrt(v[0] * v[0]  +   v[1] * v[1] ) < 0.05)))
x.close()
