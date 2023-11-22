import bpy
from mathutils import Vector

# Get the current scene
scene = bpy.context.scene

# Ensure the scene has a camera
if not scene.camera:
    print("No camera found in the scene")
    exit()

# Get the camera object
camera = scene.camera

# Get the camera's matrix world
camera_matrix_world = camera.matrix_world

# Get the camera's parameters
camera_params = camera.data

# Define the function to convert 3D coordinates to 2D
def project_3d_to_2d(world_coords):
    # Transform the world coordinates to camera coordinates
    camera_coords = camera_matrix_world.inverted() @ Vector(world_coords)
    
    # Normalize the z coordinate
    camera_coords /= camera_coords.z
    
    # Use the camera parameters to project the camera coordinates to 2D
    pixel_coords = camera_params.lens * camera_params.sensor_width * camera_coords.xy
    
    # Normalize the pixel coordinates
    pixel_coords /= camera_params.sensor_width
    
    # The y coordinate is inverted in 2D, so we flip it
    pixel_coords.y = -pixel_coords.y
    
    return pixel_coords

# Get the object by name (replace 'Plane' with the desired object name)
obj_name = 'Plane'
obj = bpy.data.objects.get(obj_name)

if not obj:
    print(f"Object '{obj_name}' not found")
    exit()

# Get the object's world matrix
world_matrix = obj.matrix_world

# Get the object's dimensions
dimensions = obj.dimensions

# Calculate the corner points in the object's local space
half_width = dimensions.x / 2
half_height = dimensions.y / 2
corners_local = [
    Vector((-half_width, -half_height, 0)),
    Vector((half_width, -half_height, 0)),
    Vector((half_width, half_height, 0)),
    Vector((-half_width, half_height, 0)),
]

# Transform the corner points to world space and calculate their 2D coordinates
corners_2d = [project_3d_to_2d(world_matrix @ corner) for corner in corners_local]

# Print the 2D coordinates
print(corners_2d)
