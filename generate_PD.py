import numpy as np
import plotly.graph_objects as go
import multiprocessing
import pickle
import os
import gc
from functools import partial
from plotly.colors import sample_colorscale
from multiprocessing.dummy import Pool as ThreadPool


def Plot_Phase_Disgram(m1, m2, planes):
    pair = tuple(sorted((m1, m2))) 
    labels = [p[-1] for p in planes]
    planes = [p[0:-1] for p in planes]

    eta_C = -9.2230488
    eta_N = -8.3162684
    
    x_grid_min, x_grid_max = eta_C-5, eta_C+5
    y_grid_min, y_grid_max = eta_N-5, eta_N+5
    resolution = 800

    x = np.linspace(x_grid_min, x_grid_max, resolution)
    y = np.linspace(y_grid_min, y_grid_max, resolution)
    x, y = np.meshgrid(x, y)

    zs = [(-a * x - b * y - d) / c for a, b, c, d in planes]
    z_stack = np.stack(zs)

    min_indices = np.argmin(z_stack, axis=0)
    valid_indices = np.unique(min_indices)
    zmin=np.min(valid_indices)
    zmax=np.max(valid_indices)
    hover_text = np.array(labels, dtype=object)[min_indices]
    hovertemplate = "x: %{x:.2f}<br>y: %{y:.2f}<br>Phase: %{text}<extra></extra>"

    fig = go.Figure(data=go.Heatmap(z=min_indices,x=x[0],y=y[:,0],text=hover_text,hovertemplate=hovertemplate,hoverinfo='text',
                                    colorscale='Viridis',showscale=False, zmin=zmin, zmax=zmax))

    fig.add_trace(go.Scatter(x=[eta_C, eta_C], y=[eta_N-5, eta_N+5], mode='lines', line=dict(color='gray', width=3),
                             name = "Chemical Potential of C from Graphene", opacity=0.5))
    fig.add_trace(go.Scatter(x=[eta_C-5, eta_C+5], y=[eta_N, eta_N], mode='lines', line=dict(color='gray', width=3),
                             name = "Chemical Potential of N from Graphene", opacity=0.5))
    
    ################################################
    valid_indices = np.unique(min_indices)
    order_list = []
    for idx in valid_indices:
        y_points = y[min_indices == idx]
        representative_y = y_points.max() if y_points.size > 0 else -np.inf
        order_list.append((idx, representative_y))

    order_list.sort(key=lambda x: x[1], reverse=True)
    ordered_valid_indices = [entry[0] for entry in order_list]
    
    for idx in ordered_valid_indices:
        fraction = idx / zmax
        color = sample_colorscale('Viridis', fraction)[0]
        fig.add_trace(go.Scatter(x=[None],y=[None],mode='markers',marker=dict(size=10, color=color),
                                 legendgroup=labels[idx],showlegend=True,name=labels[idx]))
    ################################################
    
    
    fig.update_layout(
        title=dict(text=f"Phase Diagram of {pair[0]} and {pair[1]}",x=0.35,xanchor='center',font=dict(family="Times New Roman",size=40, color="black")),
        xaxis=dict(range=[x_grid_min, x_grid_max],title="$\\Huge \\eta_C$",titlefont=dict(family="Times New Roman", size=10, color="black"),
                    tickfont=dict(family="Times New Roman", size=24, color="black")),width=1150,
        yaxis=dict(range=[y_grid_min, y_grid_max],title="$\\Huge \\eta_N$",titlefont=dict(family="Times New Roman", size=10, color="black"),
                    tickfont=dict(family="Times New Roman", size=24, color="black")),height=800,
        showlegend=True, legend=dict(orientation="v", y=1, xanchor="left", x=1.02,traceorder="normal",
                                        font=dict(family="Times New Roman", size=20, color="black")),
        margin=dict(l=80, r=200, t=80, b=80))


    html_str = fig.to_html(include_plotlyjs="cdn", include_mathjax="cdn", full_html=False)

    wrapped_html = f"""
    <html>
      <head>
        <style>
          /* This container centers the content horizontally, then shifts it right by 200px */
          .plot-container {{
            width: 100%;
            display: flex;
            justify-content: center;
            margin-left: 140px; /* Adjust this value to move the plot right */
          }}
        </style>
      </head>
      <body>
        <div class="plot-container">
          {html_str}
        </div>
      </body>
    </html>
    """

    #with open(f"../localenergy_page/PhaseDiagrams/{pair[0]}_{pair[1]}.html", "w") as f:
    with open(f"./PhaseDiagrams/{pair[0]}_{pair[1]}.html", "w") as f:
        f.write(wrapped_html)

    del fig
    gc.collect()

    return [pair]


finished = []
def assemble(parameter):
    if parameter[0] != None:
        finished.append(parameter[0])
        print(len(finished))
    else:
        print("RWONG!")
    


def abortable_worker(func, *args, **kwargs):
    timeout = kwargs.get('timeout', None)
    p = ThreadPool(1)
    res = p.apply_async(func, args = args)
    try:
        out = res.get(timeout)
    except multiprocessing.TimeoutError:
        p.terminate()
        print("Aborting due to timeout.")
        print("Failed to analyze the structure %s within limit time."%args[0])
        out = [None]
    finally:
        p.close()
        p.join()
    return out



with open("../Phases_Dict.pkl", "rb") as f:
    Phases_Dict = pickle.load(f)

tasks = [(m1, m2, tuple(sorted((m1, m2)))) for (m1, m2) in Phases_Dict.keys()]


if __name__ == "__main__":
    """
    for (m1, m2, pair) in tasks:
        planes = Phases_Dict[pair]
        Plot_Phase_Disgram(m1, m2, planes,)
        break
    """
    pool = multiprocessing.Pool(12)
    for (m1, m2, pair) in tasks:
        planes = Phases_Dict[pair]
        abortable_func = partial(abortable_worker, Plot_Phase_Disgram, timeout=600)
        pool.apply_async(abortable_func, args = (m1, m2, planes,), callback = assemble)
    pool.close()
    pool.join()

    
    print("All phase diagrams have been generated.")